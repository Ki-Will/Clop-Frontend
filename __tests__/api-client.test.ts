import { describe, it, expect, beforeEach } from 'vitest'
import { apiClient } from '../lib/api-client'

describe('apiClient Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registers user and stores token locally', async () => {
    const res = await apiClient.auth.register({
      email: 'test@example.com',
      password: 'password123',
      username: 'TestUser',
    })

    expect(res.user.email).toBe('test@example.com')
    expect(res.user.username).toBe('TestUser')
    expect(res.token).toBeDefined()
    expect(localStorage.getItem('clop_token')).toBe(res.token)
  })

  it('logins existing or mock user successfully', async () => {
    const res = await apiClient.auth.login({
      email: 'login@example.com',
      password: 'password123',
    })

    expect(res.user.email).toBe('login@example.com')
    expect(res.token).toBeDefined()
  })

  it('manages task lifecycle (get, create, update, delete)', async () => {
    // Get initial tasks
    const initialTasks = await apiClient.tasks.getTasks()
    expect(Array.isArray(initialTasks)).toBe(true)

    // Create a new task
    const newTask = await apiClient.tasks.createTask({
      title: 'Test Unit Task',
      category: 'Testing',
      durationMinutes: 30,
    })

    expect(newTask.title).toBe('Test Unit Task')
    expect(newTask.durationMinutes).toBe(30)
    expect(newTask.completed).toBe(false)

    // Update the created task
    const updatedTask = await apiClient.tasks.updateTask(newTask.id, {
      completed: true,
      title: 'Updated Unit Task',
    })

    expect(updatedTask.completed).toBe(true)
    expect(updatedTask.title).toBe('Updated Unit Task')

    // Delete the task
    const deleteRes = await apiClient.tasks.deleteTask(newTask.id)
    expect(deleteRes.success).toBe(true)
  })

  it('logs focus session and calculates stats', async () => {
    const sessionRes = await apiClient.sessions.createSession({
      durationMinutes: 25,
    })

    expect(sessionRes.durationMinutes).toBe(25)
    expect(sessionRes.completedAt).toBeDefined()

    const stats = await apiClient.sessions.getStats()
    expect(stats.totalSessions).toBeGreaterThanOrEqual(1)
    expect(stats.todaysSessionsCount).toBeGreaterThanOrEqual(1)
    expect(stats.totalFocusMinutes).toBeGreaterThanOrEqual(25)
  })

  it('manages user settings and export data', async () => {
    const settings = await apiClient.settings.getSettings()
    expect(settings.notifications).toBeDefined()

    const updatedSettings = await apiClient.settings.updateSettings({
      notifications: false,
      soundEnabled: false,
    })

    expect(updatedSettings.notifications).toBe(false)
    expect(updatedSettings.soundEnabled).toBe(false)

    const exportData = await apiClient.settings.exportData()
    expect(exportData.user).toBeDefined()
    expect(exportData.stats).toBeDefined()
  })
})
