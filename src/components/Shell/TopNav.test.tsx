import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import TopNav from './TopNav'
import { renderWithProviders } from '../../test-utils'

const fetchMock = vi.fn()

function mockJsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  } as Response
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

function setupProviderFetch(authPayload: unknown = { clientPrincipal: null }) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url === '/api/manifest') {
      return mockJsonResponse({
        version: '1.0.0',
        generatedAt: '2026-04-21T00:00:00.000Z',
        resources: [],
        categories: [],
      })
    }

    if (url === '/.auth/me') {
      return mockJsonResponse(authPayload)
    }

    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}),
    } as Response
  })
}

describe('TopNav', () => {
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

  it('renders the brand text linked to the home route', async () => {
    setupProviderFetch({ clientPrincipal: null })

    renderWithProviders(<TopNav onMenuOpen={vi.fn()} />)

    const brandLink = await screen.findByRole('link', { name: 'Contact Center Portal' })
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('renders the Browse navigation link', async () => {
    setupProviderFetch({ clientPrincipal: null })

    renderWithProviders(<TopNav onMenuOpen={vi.fn()} />)

    const browseLink = await screen.findByRole('link', { name: 'Browse' })
    expect(browseLink).toHaveAttribute('href', '/browse')
  })

  it('shows a Sign In link when no authenticated user is present', async () => {
    setupProviderFetch({ clientPrincipal: null })

    renderWithProviders(<TopNav onMenuOpen={vi.fn()} />)

    const signInLink = await screen.findByRole('link', { name: 'Sign In' })
    expect(signInLink).toHaveAttribute('href', '/.auth/login/aad')
  })

  it('shows the authenticated user name when a user is present', async () => {
    setupProviderFetch({
      clientPrincipal: {
        userDetails: 'jamie@contoso.com',
        userRoles: ['authenticated'],
      },
    })

    renderWithProviders(<TopNav onMenuOpen={vi.fn()} />)

    expect(await screen.findByText('jamie@contoso.com')).toBeInTheDocument()
  })

  it('renders the hamburger control when the viewport is set to mobile width', async () => {
    setupProviderFetch({ clientPrincipal: null })
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    window.dispatchEvent(new Event('resize'))

    renderWithProviders(<TopNav onMenuOpen={vi.fn()} />)

    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument()
  })

  it('navigates to search results when Enter is pressed with a non-empty query', async () => {
    setupProviderFetch({ clientPrincipal: null })
    const user = userEvent.setup()

    renderWithProviders(
      <>
        <TopNav onMenuOpen={vi.fn()} />
        <LocationDisplay />
      </>
    )

    const input = await screen.findByRole('searchbox', { name: 'Search resources' })
    await user.type(input, 'playbook{enter}')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/search?q=playbook')
    })
  })

  it('does not navigate when Enter is pressed with an empty query', async () => {
    setupProviderFetch({ clientPrincipal: null })

    renderWithProviders(
      <>
        <TopNav onMenuOpen={vi.fn()} />
        <LocationDisplay />
      </>,
      { route: '/' }
    )

    const input = await screen.findByRole('searchbox', { name: 'Search resources' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
