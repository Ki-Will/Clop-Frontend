import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { Dashboard } from '../components/dashboard'
import { AuthProvider } from '../components/auth-context'

describe('Dashboard Component Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders dashboard with navbar title and main elements', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      )
    })

    expect(screen.getByText('Clop')).toBeDefined()
    expect(screen.getByText('Daily Goal Progress')).toBeDefined()
  })

  it('allows adding a new task', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      )
    })

    // Click "Add" task button
    const addButton = screen.getByText('Add')
    await act(async () => {
      addButton.click()
    })

    // Add task dialog should be visible
    expect(screen.getByText('Add New Task')).toBeDefined()
  })
})
