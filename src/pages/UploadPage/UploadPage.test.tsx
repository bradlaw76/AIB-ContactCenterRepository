import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadPage from './UploadPage'
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
  resources: [],
  categories: [{ name: 'Training', order: 1 }],
}

function setupFetch(options?: { isManager?: boolean }) {
  const isManager = options?.isManager ?? false

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

    if (url === '/api/upload' && init?.method === 'POST') {
      return mockJsonResponse({ id: 'uploaded-1' })
    }

    return mockJsonResponse({}, false)
  })
}

function renderUpload(route = '/upload') {
  return renderWithProviders(
    <Routes>
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/" element={<div>Home Route</div>} />
      <Route path="/resource/:id" element={<div>Resource Route</div>} />
    </Routes>,
    { route }
  )
}

describe('UploadPage', () => {
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

    renderUpload()

    expect(await screen.findByText('Home Route')).toBeInTheDocument()
  })

  it('renders file dropzone for content manager', async () => {
    setupFetch({ isManager: true })

    renderUpload()

    expect(await screen.findByText(/Drag and drop a file here/i)).toBeInTheDocument()
  })

  it('shows error for file over 100MB', async () => {
    setupFetch({ isManager: true })
    const user = userEvent.setup()

    renderUpload()

    const input = await screen.findByLabelText('Choose File')
    const oversizedFile = new File(['x'], 'too-large.pdf', { type: 'application/pdf' })
    Object.defineProperty(oversizedFile, 'size', { value: 100 * 1024 * 1024 + 1 })

    await user.upload(input, oversizedFile)

    expect(await screen.findByText('File exceeds the 100MB upload limit.')).toBeInTheDocument()
  })

  it('shows error for disallowed file type', async () => {
    setupFetch({ isManager: true })
    const user = userEvent.setup({ applyAccept: false })

    renderUpload()

    const input = await screen.findByLabelText('Choose File')
    const invalidFile = new File(['x'], 'malware.exe', { type: 'application/octet-stream' })

    await user.upload(input, invalidFile)

    expect(
      await screen.findByText('Unsupported file type. Please select an allowed file format.')
    ).toBeInTheDocument()
  })

  it('submit calls /api/upload with FormData', async () => {
    setupFetch({ isManager: true })
    const user = userEvent.setup()

    renderUpload()

    const input = await screen.findByLabelText('Choose File')
    const validFile = new File(['hello'], 'guide.pdf', { type: 'application/pdf' })
    await user.upload(input, validFile)

    await user.clear(screen.getByRole('textbox', { name: 'Title *' }))
    await user.type(screen.getByRole('textbox', { name: 'Title *' }), 'Uploaded Guide')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category *' }), 'Training')
    await user.click(screen.getByRole('button', { name: 'Upload Resource' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
      )
    })
  })
})
