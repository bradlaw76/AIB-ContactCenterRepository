import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Footer from './Footer'
import { renderWithProviders } from '../../test-utils'

const fetchMock = vi.fn()

function setupProviderFetch() {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url === '/api/manifest' || url === '/.auth/me') {
      return new Promise<Response>(() => {})
    }

    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}),
    } as Response
  })
}

describe('Footer', () => {
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

  it('renders the copyright text', () => {
    setupProviderFetch()

    renderWithProviders(<Footer />)

    expect(screen.getByText(/contact center portal/i)).toBeInTheDocument()
  })

  it('renders the expected year in the footer', () => {
    setupProviderFetch()

    renderWithProviders(<Footer />)

    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })
})
