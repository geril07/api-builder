import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()

vi.mock('@/shared/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    })),
  },
}))

const { getEffectiveWorkspace, getEffectiveWorkspaceId } =
  await import('./workspace')

describe('getEffectiveWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the active workspace when the user is a member', async () => {
    mockLimit.mockResolvedValueOnce([
      { id: 'ws-active', name: 'Active Workspace' },
    ])

    const result = await getEffectiveWorkspace('user-1', 'ws-active')

    expect(result).toEqual({ id: 'ws-active', name: 'Active Workspace' })
    expect(mockLimit).toHaveBeenCalledTimes(1)
  })

  it('falls back to personal workspace when active workspace is not the user', async () => {
    mockLimit.mockResolvedValueOnce([])
    mockLimit.mockResolvedValueOnce([
      { id: 'ws-personal', name: 'Personal Workspace' },
    ])

    const result = await getEffectiveWorkspace('user-1', 'ws-other')

    expect(result).toEqual({ id: 'ws-personal', name: 'Personal Workspace' })
    expect(mockLimit).toHaveBeenCalledTimes(2)
  })

  it('returns personal workspace when no active workspace is specified', async () => {
    mockLimit.mockResolvedValueOnce([
      { id: 'ws-personal', name: 'Personal Workspace' },
    ])

    const result = await getEffectiveWorkspace('user-1')

    expect(result).toEqual({ id: 'ws-personal', name: 'Personal Workspace' })
    expect(mockLimit).toHaveBeenCalledTimes(1)
  })

  it('returns undefined when neither active nor personal workspace exists', async () => {
    mockLimit.mockResolvedValueOnce([])
    mockLimit.mockResolvedValueOnce([])

    const result = await getEffectiveWorkspace('user-1', 'ws-missing')

    expect(result).toBeUndefined()
  })

  it('returns undefined when user has no workspaces at all', async () => {
    mockLimit.mockResolvedValueOnce([])

    const result = await getEffectiveWorkspace('user-1')

    expect(result).toBeUndefined()
  })
})

describe('getEffectiveWorkspaceId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the workspace id when a workspace is found', async () => {
    mockLimit.mockResolvedValueOnce([{ id: 'ws-1', name: 'My Workspace' }])

    const result = await getEffectiveWorkspaceId('user-1', 'ws-1')

    expect(result).toBe('ws-1')
  })

  it('returns undefined when no workspace is found', async () => {
    mockLimit.mockResolvedValueOnce([])
    mockLimit.mockResolvedValueOnce([])

    const result = await getEffectiveWorkspaceId('user-1', 'ws-missing')

    expect(result).toBeUndefined()
  })
})
