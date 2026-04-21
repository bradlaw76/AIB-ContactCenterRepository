import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function mockJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    json: async () => body,
  } as Response
}

const fetchMock = vi.fn()

function AuthConsumer() {
  const { user, loading, isContentManager } = useAuth()
  return (
    <div>
      <div>loading:{String(loading)}</div>
      <div>user:{user?.userDetails ?? 'none'}</div>
      <div>isContentManager:{String(isContentManager)}</div>
    </div>
  )
}

describe('AuthProvider and useAuth', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('fetches /.auth/me on mount', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ clientPrincipal: null }))

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/.auth/me'))
  })

  it('keeps user null when /.auth/me returns no clientPrincipal', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ clientPrincipal: null }))

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
      expect(screen.getByText('user:none')).toBeInTheDocument()
    })
  })

  it('populates user when /.auth/me returns a clientPrincipal', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        clientPrincipal: {
          userDetails: 'alex@contoso.com',
          userRoles: ['authenticated'],
        },
      })
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('user:alex@contoso.com')).toBeInTheDocument()
    })
  })

  it('reports isContentManager as false when roles do not include content-manager', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        clientPrincipal: {
          userDetails: 'alex@contoso.com',
          userRoles: ['authenticated', 'viewer'],
        },
      })
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('isContentManager:false')).toBeInTheDocument()
    })
  })

  it('reports isContentManager as true when roles include content-manager', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
        clientPrincipal: {
          userDetails: 'alex@contoso.com',
          userRoles: ['authenticated', 'content-manager'],
        },
      })
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('isContentManager:true')).toBeInTheDocument()
    })
  })

  it('throws when useAuth is used outside the provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BrokenConsumer() {
      useAuth()
      return null
    }

    expect(() => render(<BrokenConsumer />)).toThrow('useAuth must be used within an AuthProvider')

    consoleErrorSpy.mockRestore()
  })
})
