import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ManagePage from './ManagePage'
import { renderWithProviders } from '../../test-utils'
import type { Manifest } from '../../context/ManifestContext'

const fetchMock = vi.fn()

function mockJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    json: async () => body,
  } as Response
}

const manifest: Manifest = {
  version: '1.0.0',
  generatedAt: '2026-04-21T00:00:00.000Z',
  resources: [
    {
      id: 'own-1',
      title: 'My Upload',
      description: 'Owned by manager',
      category: 'Training',
      type: 'document',
      fileExt: 'pdf',
      blobName: 'my-upload.pdf',
      fileSize: 1000,
      uploadDate: '2026-04-21T00:00:00.000Z',
      uploadedBy: 'manager@contoso.com',
      featured: false,
    },
    {
      id: 'other-1',
      title: 'Someone Else Upload',
      description: 'Owned by another user',
      category: 'Operations',
      type: 'video',
      fileExt: 'mp4',
      blobName: 'other.mp4',
      fileSize: 2000,
      uploadDate: '2026-04-20T00:00:00.000Z',
      uploadedBy: 'other@contoso.com',
      featured: false,
    },
  ],
  categories: [
    { name: 'Training', order: 1 },
    { name: 'Operations', order: 2 },
  ],
}

function setupFetch(options?: { isManager?: boolean; userDetails?: string }) {
  const isManager = options?.isManager ?? false
  const userDetails = options?.userDetails ?? 'manager@contoso.com'

  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url === '/.auth/me') {
      return mockJsonResponse({
        clientPrincipal: {
          userDetails,
          userRoles: isManager ? ['authenticated', 'content-manager'] : ['authenticated'],
        },
      })
    }

    if (url === '/api/manifest') {
      return mockJsonResponse(manifest)
    }

    if (url === '/api/resource/own-1' && init?.method === 'DELETE') {
      return mockJsonResponse({ ok: true })
    }

    return mockJsonResponse({}, false)
  })
}

function renderManage(route = '/manage') {
  return renderWithProviders(
    <Routes>
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/" element={<div>Home Route</div>} />
    </Routes>,
    { route }
  )
}

describe('ManagePage', () => {
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

  it('redirects non-content-manager to home', async () => {
    setupFetch({ isManager: false })

    renderManage()

    expect(await screen.findByText('Home Route')).toBeInTheDocument()
  })

  it('shows empty state when user has no uploads', async () => {
    setupFetch({ isManager: true, userDetails: 'new.manager@contoso.com' })

    renderManage()

    expect(await screen.findByRole('heading', { name: "You haven't uploaded any resources yet" })).toBeInTheDocument()
  })

  it('shows table with user uploaded resources', async () => {
    setupFetch({ isManager: true, userDetails: 'manager@contoso.com' })

    renderManage()

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByText('My Upload')).toBeInTheDocument()
    expect(screen.queryByText('Someone Else Upload')).not.toBeInTheDocument()
  })

  it('delete action calls DELETE /api/resource/:id on confirm', async () => {
    setupFetch({ isManager: true, userDetails: 'manager@contoso.com' })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    renderManage()

    await screen.findByText('My Upload')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/resource/own-1', { method: 'DELETE' })
    })

    confirmSpy.mockRestore()
  })
})
