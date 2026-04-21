import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import MobileDrawer from './MobileDrawer'
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

describe('MobileDrawer', () => {
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

  it('renders when open and is absent when closed', () => {
    setupProviderFetch()

    const { rerender } = renderWithProviders(<MobileDrawer isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeInTheDocument()

    rerender(<MobileDrawer isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).not.toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', () => {
    setupProviderFetch()
    const onClose = vi.fn()

    renderWithProviders(<MobileDrawer isOpen={true} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', () => {
    setupProviderFetch()
    const onClose = vi.fn()

    renderWithProviders(<MobileDrawer isOpen={true} onClose={onClose} />)

    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement | null
    expect(backdrop).not.toBeNull()

    if (backdrop) {
      fireEvent.click(backdrop)
    }

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside drawer content', () => {
    setupProviderFetch()
    const onClose = vi.fn()

    renderWithProviders(<MobileDrawer isOpen={true} onClose={onClose} />)

    fireEvent.click(screen.getByRole('dialog', { name: 'Navigation menu' }))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('exposes dialog semantics with aria-modal true', () => {
    setupProviderFetch()

    renderWithProviders(<MobileDrawer isOpen={true} onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
