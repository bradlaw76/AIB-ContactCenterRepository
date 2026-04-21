import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BrowsePage from './BrowsePage'
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
      id: 'b1',
      title: 'Alpha Document',
      description: 'Doc A',
      category: 'Training',
      type: 'document',
      fileExt: 'pdf',
      blobName: 'alpha.pdf',
      fileSize: 1000,
      uploadDate: '2026-04-20T00:00:00.000Z',
      uploadedBy: 'owner@contoso.com',
      featured: false,
    },
    {
      id: 'b2',
      title: 'Zulu Video',
      description: 'Video Z',
      category: 'Operations',
      type: 'video',
      fileExt: 'mp4',
      blobName: 'zulu.mp4',
      fileSize: 2000,
      uploadDate: '2026-04-21T00:00:00.000Z',
      uploadedBy: 'owner@contoso.com',
      featured: false,
    },
    {
      id: 'b3',
      title: 'Beta Image',
      description: 'Image B',
      category: 'Training',
      type: 'image',
      fileExt: 'png',
      blobName: 'beta.png',
      fileSize: 3000,
      uploadDate: '2026-04-19T00:00:00.000Z',
      uploadedBy: 'owner@contoso.com',
      featured: false,
    },
  ],
  categories: [
    { name: 'Training', order: 1 },
    { name: 'Operations', order: 2 },
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

describe('BrowsePage', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders all resources when no filters are changed', async () => {
    setupFetch()

    renderWithProviders(<BrowsePage />, { route: '/browse' })

    expect(await screen.findByText('Showing 3 resources')).toBeInTheDocument()
    expect(screen.getByText('Alpha Document')).toBeInTheDocument()
    expect(screen.getByText('Zulu Video')).toBeInTheDocument()
    expect(screen.getByText('Beta Image')).toBeInTheDocument()
  })

  it('filters by type checkbox', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(<BrowsePage />, { route: '/browse' })

    await screen.findByText('Showing 3 resources')
    await user.click(screen.getByRole('checkbox', { name: 'Video' }))

    expect(screen.queryByText('Zulu Video')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 2 resources')).toBeInTheDocument()
  })

  it('filters by category checkbox', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(<BrowsePage />, { route: '/browse' })

    await screen.findByText('Showing 3 resources')
    await user.click(screen.getByRole('checkbox', { name: 'Operations' }))

    expect(screen.queryByText('Zulu Video')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 2 resources')).toBeInTheDocument()
  })

  it('sorts by A-Z', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(<BrowsePage />, { route: '/browse' })

    await screen.findByText('Showing 3 resources')
    await user.selectOptions(screen.getByRole('combobox'), 'az')

    const headings = screen.getAllByRole('heading', { level: 3 })
    const inOrder = headings.map((item) => item.textContent)
    expect(inOrder.slice(0, 3)).toEqual(['Alpha Document', 'Beta Image', 'Zulu Video'])
  })

  it('shows empty state when filters yield 0 results', async () => {
    setupFetch()
    const user = userEvent.setup()

    renderWithProviders(<BrowsePage />, { route: '/browse' })

    await screen.findByText('Showing 3 resources')
    await user.click(screen.getByRole('checkbox', { name: 'Document' }))
    await user.click(screen.getByRole('checkbox', { name: 'Video' }))
    await user.click(screen.getByRole('checkbox', { name: 'Image' }))

    expect(screen.getByRole('heading', { name: 'No matching resources' })).toBeInTheDocument()
    expect(screen.getByText('Showing 0 resources')).toBeInTheDocument()
  })
})
