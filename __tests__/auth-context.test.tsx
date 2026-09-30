import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../components/auth-context'
import { apiClient } from '../lib/api-client'

const TEST_EMAIL = 'user@test.com'
const PASSWORD = 'password123'

function TestConsumer() {
  const { user, login, logout } = useAuth()

  return (
    <div>
      <span data-testid="username">{user ? user.username || user.email : 'Logged Out'}</span>
      <button onClick={() => login(TEST_EMAIL, PASSWORD)}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default unauthenticated state and allows logging in / out', async () => {
    // Seed the account used by this test (idempotent: register on first run,
    // log in on subsequent runs so the suite works against a shared dev DB)
    try {
      await apiClient.auth.register({ email: TEST_EMAIL, password: PASSWORD, username: 'Test User' })
    } catch {
      await apiClient.auth.login({ email: TEST_EMAIL, password: PASSWORD })
    }
    // Start the provider in a signed-out state
    localStorage.removeItem('clop_token')

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
