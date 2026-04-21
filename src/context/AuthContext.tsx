import { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useAuth() {
  return { user: null, loading: false }
}
