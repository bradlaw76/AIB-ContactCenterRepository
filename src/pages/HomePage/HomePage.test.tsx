import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import HomePage from './HomePage'
import { renderWithProviders } from '../../test-utils'
import type { Manifest } from '../../context/ManifestContext'

const fetchMock = vi.fn()

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function mockJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    json: async () => body,
  } as Response
}

const sampleManifest: Manifest = {
  version: '1.0.0',
  generatedAt: '2026-04-21T00:00:00.000Z',
  resources: [
    {
      id: 'r1',
      title: 'Featured Playbook',
      description: 'High priority process guide',
      category: 'Training',
      type: 'document',
      fileExt: 'pdf',
      blobName: 'featured-playbook.pdf',
      fileSize: 1200,
      uploadDate: '2026-04-20T00:00:00.000Z',
      uploadedBy: 'manager@contoso.com',
      featured: true,
    },
    {
      id: 'r2',
      title: 'Call Recording Example',
      description: 'Sample call recording',
      category: 'Operations',
      type: 'video',
      fileExt: 'mp4',
      blobName: 'call-recording.mp4',
      fileSize: 3200,
      uploadDate: '2026-04-21T00:00:00.000Z',
      uploadedBy: 'manager@contoso.com',
      featured: false,
    },
  ],
  categories: [
    { name: 'Training', order: 1 },
    { name: 'Operations', order: 2 },
  ],
}

function setupFetch(manifest: Manifest | Promise<Response>) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url === '/.auth/me') {
      return mockJsonResponse({ clientPrincipal: null })
    }

    if (url === '/api/manifest') {
      if (manifest instanceof Promise) {
        return manifest
      }
      return mockJsonResponse(manifest)
    }

    return mockJsonResponse({}, false)
  })
}

describe('HomePage', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders hero banner with expected heading text', async () => {
    setupFetch(sampleManifest)

    renderWithProviders(<HomePage />)

    expect(await screen.findByRole('heading', { name: 'Contact Center Resources' })).toBeInTheDocument()
  })

  it('shows loading skeletons while manifest is loading', async () => {
    const deferred = createDeferred<Response>()
    setupFetch(deferred.promise)

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Loading resources')).toBeInTheDocument()
    })

    deferred.resolve(mockJsonResponse(sampleManifest))
    expect(await screen.findByText('Featured')).toBeInTheDocument()
  })

  it('renders Featured section with featured resources', async () => {
    setupFetch(sampleManifest)

    renderWithProviders(<HomePage />)

    const featuredHeading = await screen.findByRole('heading', { name: 'Featured' })
    const featuredSection = featuredHeading.closest('section')

    expect(featuredSection).not.toBeNull()
    expect(within(featuredSection as HTMLElement).getByText('Featured Playbook')).toBeInTheDocument()
  })

  it('renders Recently Added section', async () => {
    setupFetch(sampleManifest)

    renderWithProviders(<HomePage />)

    expect(await screen.findByRole('heading', { name: 'Recently Added' })).toBeInTheDocument()
    expect(screen.getByText('Call Recording Example')).toBeInTheDocument()
  })

  it('renders empty state when no resources', async () => {
    setupFetch({ ...sampleManifest, resources: [] })

    renderWithProviders(<HomePage />)

    expect(await screen.findByRole('heading', { name: 'No resources yet' })).toBeInTheDocument()
  })
})
