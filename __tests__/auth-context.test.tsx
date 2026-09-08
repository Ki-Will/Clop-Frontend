import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../components/auth-context'

function TestConsumer() {
  const { user, login, logout } = useAuth()

  return (
    <div>
      <span data-testid="username">{user ? user.username || user.email : 'Logged Out'}</span>
      <button onClick={() => login('user@test.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default unauthenticated state and allows logging in / out', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('username').textContent).toBe('Logged Out')

    // Click login
    await act(async () => {
      screen.getByText('Login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).not.toBe('Logged Out')
    })

    // Click logout
    await act(async () => {
      screen.getByText('Logout').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('Logged Out')
    })
  })
})
