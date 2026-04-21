import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ManifestProvider } from './context/ManifestContext'

interface ProviderProps {
  children: ReactNode
  route: string
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

function AllProviders({ children, route }: ProviderProps) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>
          <ManifestProvider>{children}</ManifestProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: ExtendedRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => <AllProviders route={route}>{children}</AllProviders>,
    ...options,
  })
}
