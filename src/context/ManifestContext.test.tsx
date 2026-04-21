import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ManifestProvider, useManifest, type Manifest } from './ManifestContext'

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

function mockJsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK'): Response {
  return {
    ok,
    status,
    statusText,
    json: async () => body,
  } as Response
}

const fetchMock = vi.fn()

const sampleManifest: Manifest = {
  version: '1.0.0',
  generatedAt: '2026-04-21T12:00:00.000Z',
  resources: [],
  categories: [],
}

function ManifestConsumer() {
  const { state, refresh } = useManifest()

  return (
    <div>
      <div>loading:{String(state.loading)}</div>
      <div>error:{state.error ?? 'none'}</div>
      <div>resources:{state.manifest?.resources.length ?? 0}</div>
      <button onClick={refresh}>refresh manifest</button>
    </div>
  )
}

describe('ManifestProvider and useManifest', () => {
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

  it('renders children without crashing', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse(sampleManifest))

    render(
      <ManifestProvider>
        <div>manifest child</div>
      </ManifestProvider>
    )

    expect(screen.getByText('manifest child')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/manifest'))
  })

  it('shows loading state while manifest is fetching and then clears loading after success', async () => {
    const deferred = createDeferred<Response>()
    fetchMock.mockReturnValue(deferred.promise)

    render(
      <ManifestProvider>
        <ManifestConsumer />
      </ManifestProvider>
    )

    await waitFor(() => expect(screen.getByText('loading:true')).toBeInTheDocument())

    deferred.resolve(mockJsonResponse(sampleManifest))

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
      expect(screen.getByText('resources:0')).toBeInTheDocument()
    })
  })

  it('fetches /api/manifest on mount and populates manifest state', async () => {
    const manifestWithData: Manifest = {
      ...sampleManifest,
      resources: [
        {
          id: 'r1',
          title: 'Guide',
          description: 'A guide',
          category: 'General',
          type: 'document',
          fileExt: '.pdf',
          blobName: 'guide.pdf',
          fileSize: 1024,
          uploadDate: '2026-04-21',
          uploadedBy: 'tester',
          featured: false,
        },
      ],
    }

    fetchMock.mockResolvedValue(mockJsonResponse(manifestWithData))

    render(
      <ManifestProvider>
        <ManifestConsumer />
      </ManifestProvider>
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/manifest')
      expect(screen.getByText('resources:1')).toBeInTheDocument()
    })
  })

  it('sets error state when manifest fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'))

    render(
      <ManifestProvider>
        <ManifestConsumer />
      </ManifestProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
      expect(screen.getByText('error:Network down')).toBeInTheDocument()
    })
  })

  it('refresh triggers a new manifest fetch', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse(sampleManifest))
      .mockResolvedValueOnce(
        mockJsonResponse({
          ...sampleManifest,
          resources: [
            {
              id: 'r2',
              title: 'Playbook',
              description: 'Playbook',
              category: 'General',
              type: 'document',
              fileExt: '.pdf',
              blobName: 'playbook.pdf',
              fileSize: 2048,
              uploadDate: '2026-04-21',
              uploadedBy: 'tester',
              featured: true,
            },
          ],
        })
      )

    render(
      <ManifestProvider>
        <ManifestConsumer />
      </ManifestProvider>
    )

    await waitFor(() => expect(screen.getByText('resources:0')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'refresh manifest' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(screen.getByText('resources:1')).toBeInTheDocument()
    })
  })

  it('throws a useful error when useManifest is used outside the provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BrokenConsumer() {
      useManifest()
      return null
    }

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useManifest must be used within a ManifestProvider'
    )

    consoleErrorSpy.mockRestore()
  })
})
