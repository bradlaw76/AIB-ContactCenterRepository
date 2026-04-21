import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigate } from 'react-router-dom'
import SearchPage from './SearchPage'
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
      id: 'doc-1',
      title: 'Policy Document',
      description: 'Official policy',
      category: 'Policy',
      type: 'document',
      fileExt: 'pdf',
      blobName: 'policy.pdf',
      fileSize: 1000,
      uploadDate: '2026-04-20T00:00:00.000Z',
      uploadedBy: 'owner@contoso.com',
      featured: false,
    },
    {
      id: 'vid-1',
      title: 'Policy Walkthrough Video',
      description: 'Video walkthrough',
      category: 'Training',
      type: 'video',
      fileExt: 'mp4',
      blobName: 'walkthrough.mp4',
      fileSize: 2000,
      uploadDate: '2026-04-21T00:00:00.000Z',
      uploadedBy: 'owner@contoso.com',
      featured: false,
    },
    {
      id: 'img-1',
      title: 'Team Diagram',
      description: 'Architecture image',
      category: 'Reference',
      type: 'image',
      fileExt: 'png',
      blobName: 'diagram.png',
      fileSize: 3000,
      uploadDate: '2026-04-19T00:00:00.000Z',
      uploadedBy: 'owner@contoso.com',
      featured: false,
    },
  ],
  categories: [
    { name: 'Policy', order: 1 },
    { name: 'Training', order: 2 },
    { name: 'Reference', order: 3 },
  ],
}

function setupFetch() {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url === '/.auth/me') {
      return mockJsonResponse({ clientPrincipal: null })
    }

    if (url === '/api/manifest') {
      return mockJsonResponse(manifest)
    }

    return mockJsonResponse({}, false)
  })
}

function QueryChanger() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate('/search?q=diagram')}>
      Change query
    </button>
  )
}

describe('SearchPage', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders search results matching query from URL', async () => {
    setupFetch()

    renderWithProviders(<SearchPage />, { route: '/search?q=policy' })

    expect(await screen.findByText(/results for 'policy'/i)).toBeInTheDocument()
    expect(screen.getByText('Policy Document')).toBeInTheDocument()
  })

  it('renders empty state when no results match', async () => {
    setupFetch()

    renderWithProviders(<SearchPage />, { route: '/search?q=nonexistent' })

    expect(await screen.findByRole('heading', { name: 'No resources found' })).toBeInTheDocument()
  })

  it('type filter chips filter by type', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(<SearchPage />, { route: '/search?q=policy' })

    await screen.findByText('Policy Document')
    await user.click(screen.getByRole('button', { name: 'Document' }))

    expect(screen.getByText('Policy Document')).toBeInTheDocument()
    expect(screen.queryByText('Policy Walkthrough Video')).not.toBeInTheDocument()
  })

  it('clears type filter when All chip is selected', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(<SearchPage />, { route: '/search?q=policy' })

    await screen.findByText('Policy Document')
    await user.click(screen.getByRole('button', { name: 'Document' }))
    await user.click(screen.getByRole('button', { name: 'All' }))

    expect(screen.getByText('Policy Walkthrough Video')).toBeInTheDocument()
  })

  it('updates results when URL query changes', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(
      <>
        <QueryChanger />
        <SearchPage />
      </>,
      { route: '/search?q=policy' }
    )

    await screen.findByText('Policy Document')
    await user.click(screen.getByRole('button', { name: 'Change query' }))

    expect(await screen.findByText(/results for 'diagram'/i)).toBeInTheDocument()
    expect(screen.getByText('Team Diagram')).toBeInTheDocument()
  })
})
