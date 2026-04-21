import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test-utils'
import ResourceDetailPage from './ResourceDetailPage'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      id: 'r-1',
      title: 'Known Resource',
      description: 'Known description',
      category: 'Training',
      type: 'image',
      fileExt: 'png',
      blobName: 'known.png',
      fileSize: 2048,
      uploadDate: '2026-04-21T00:00:00.000Z',
      uploadedBy: 'manager@contoso.com',
      featured: false,
    },
  ],
  categories: [{ name: 'Training', order: 1 }],
}

function setupFetch(options?: { isManager?: boolean; sasUrl?: string }) {
  const isManager = options?.isManager ?? false
  const sasUrl = options?.sasUrl ?? 'https://example.com/resource.png?sig=abc'

  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url === '/.auth/me') {
      if (isManager) {
        return mockJsonResponse({
          clientPrincipal: {
            userDetails: 'manager@contoso.com',
            userRoles: ['authenticated', 'content-manager'],
          },
        })
      }

      return mockJsonResponse({
        clientPrincipal: {
          userDetails: 'viewer@contoso.com',
          userRoles: ['authenticated'],
        },
      })
    }

    if (url === '/api/manifest') {
      return mockJsonResponse(manifest)
    }

    if (url === '/api/resource/r-1/url') {
      return mockJsonResponse({ url: sasUrl })
    }

    if (url === '/api/resource/r-1' && init?.method === 'DELETE') {
      return mockJsonResponse({ ok: true })
    }

    if (url === '/api/resource/r-1' && init?.method === 'PUT') {
      return mockJsonResponse({ ok: true })
    }

    return mockJsonResponse({}, false)
  })
}

function renderDetail(route = '/resource/r-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/resource/:id" element={<ResourceDetailPage />} />
      <Route path="/browse" element={<div>Browse Landing</div>} />
    </Routes>,
    { route }
  )
}

describe('ResourceDetailPage', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', vi.fn())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders 404 state for unknown id', async () => {
    setupFetch()

    renderDetail('/resource/unknown-id')

    expect(await screen.findByRole('heading', { name: 'Resource not found' })).toBeInTheDocument()
  })

  it('renders title and description for known resource', async () => {
    setupFetch()

    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Known Resource' })).toBeInTheDocument()
    expect(screen.getByText('Known description')).toBeInTheDocument()
  })

  it('fetches SAS URL from /api/resource/:id/url', async () => {
    setupFetch()

    renderDetail()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/resource/r-1/url')
    })
  })

  it('renders InlineViewer with sasUrl', async () => {
    setupFetch({ sasUrl: 'https://example.com/signed-image.png?sig=123' })

    renderDetail()

    const image = await screen.findByRole('img', { name: 'Known Resource' })
    expect(image).toHaveAttribute('src', 'https://example.com/signed-image.png?sig=123')
  })

  it('copy-link button adds toast', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderDetail()

    await screen.findByRole('heading', { name: 'Known Resource' })
    await user.click(screen.getByRole('button', { name: 'Copy Link' }))

    expect(await screen.findByText('Link copied!')).toBeInTheDocument()
  })

  it('renders Download button', async () => {
    setupFetch()

    renderDetail()

    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('shows delete button for content manager who uploaded the resource', async () => {
    setupFetch({ isManager: true })

    renderDetail()

    expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('does not show delete button for non-manager', async () => {
    setupFetch({ isManager: false })

    renderDetail()

    await screen.findByRole('heading', { name: 'Known Resource' })
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
